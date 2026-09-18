package notifier

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/gogo/protobuf/proto"
	alertingClusterPB "github.com/grafana/alerting/cluster/clusterpb"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
)

func TestNewRedisChannel(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	defer mr.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	p := &redisPeer{
		redis:     rdb,
		logger:    log.NewNopLogger(),
		shutdownc: make(chan struct{}),
	}
	t.Cleanup(func() { close(p.shutdownc) })

	t.Run("default queue size when 0 is passed", func(t *testing.T) {
		channel := newRedisChannel(p, "testKey", "testChannel", "testType", 0)
		require.NotNil(t, channel)
		require.Equal(t, 200, cap(channel.(*RedisChannel).msgc))
	})

	t.Run("custom queue size", func(t *testing.T) {
		channel := newRedisChannel(p, "testKey", "testChannel", "testType", 500)
		require.NotNil(t, channel)
		require.Equal(t, 500, cap(channel.(*RedisChannel).msgc))
	})
}

func TestBroadcastAndHandleMessages(t *testing.T) {
	const channelName = "testChannel"

	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})
	t.Cleanup(func() { _ = rdb.Close() })

	shutdownc := make(chan struct{})
	t.Cleanup(func() { close(shutdownc) })

	p := &redisPeer{
		redis:                   rdb,
		logger:                  log.NewNopLogger(),
		shutdownc:               shutdownc,
		messagesSent:            prometheus.NewCounterVec(prometheus.CounterOpts{Name: "test_messages_sent"}, []string{"msg_type"}),
		messagesSentSize:        prometheus.NewCounterVec(prometheus.CounterOpts{Name: "test_messages_sent_size"}, []string{"msg_type"}),
		messagesPublishFailures: prometheus.NewCounterVec(prometheus.CounterOpts{Name: "test_messages_publish_failures"}, []string{"msg_type", "reason"}),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	t.Cleanup(cancel)

	// Subscribe before broadcasting so miniredis cannot drop the message.
	pubSub := rdb.Subscribe(ctx, channelName)
	t.Cleanup(func() { _ = pubSub.Close() })
	_, err = pubSub.Receive(ctx)
	require.NoError(t, err)
	msgs := pubSub.Channel()

	channel := newRedisChannel(p, "testKey", channelName, "testType", 0).(*RedisChannel)

	msg := []byte("test message")
	channel.Broadcast(msg)

	select {
	case receivedMsg := <-msgs:
		var part alertingClusterPB.Part
		require.NoError(t, proto.Unmarshal([]byte(receivedMsg.Payload), &part))
		require.Equal(t, channelName, receivedMsg.Channel)
		require.Equal(t, msg, part.Data)
	case <-ctx.Done():
		t.Fatal("timed out waiting for redis broadcast")
	}
}
