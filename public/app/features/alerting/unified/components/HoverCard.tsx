import { css } from '@emotion/css';
import { Placement } from '@popperjs/core';
import classnames from 'classnames';
import { ReactElement, ReactNode, RefObject, cloneElement, useEffect, useMemo, useRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Popover as GrafanaPopover, PopoverController, Stack, useStyles2 } from '@grafana/ui';

export interface PopupCardProps {
  children: ReactElement<Record<string, unknown>>;
  header?: ReactNode;
  content: ReactElement;
  footer?: ReactNode;
  wrapperClassName?: string;
  placement?: Placement;
  disabled?: boolean;
  showAfter?: number;
  arrow?: boolean;
  showOn?: 'click' | 'hover';
  disableBlur?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export const PopupCard = ({
  children,
  header,
  content,
  footer,
  arrow,
  showAfter = 300,
  wrapperClassName,
  disabled = false,
  showOn = 'hover',
  disableBlur = false,
  isOpen,
  onClose,
  onToggle,
  ...rest
}: PopupCardProps) => {
  const popoverRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ignoreRefs = useMemo(() => [popoverRef, contentRef], []);
  const styles = useStyles2(getStyles);

  if (disabled) {
    return children;
  }

  const showOnHover = showOn === 'hover';
  const showOnClick = showOn === 'click';

  const body = (
    <div ref={contentRef}>
      <Stack direction="column" gap={0} role="tooltip">
        {header && <div className={styles.card.header}>{header}</div>}
        <div className={styles.card.body}>{content}</div>
        {footer && <div className={styles.card.footer}>{footer}</div>}
      </Stack>
    </div>
  );

  return (
    <PopoverController content={body} hideAfter={100}>
      {(showPopper, hidePopper, popperProps) => {
        // Use manual control if provided, otherwise use internal state
        const isManuallyControlled = isOpen !== undefined;
        const shouldShow = isManuallyControlled ? isOpen : popperProps.show;

        const handleClose = () => {
          if (onClose) {
            onClose();
          } else {
            hidePopper();
          }
        };

        const handleShow = () => {
          if (!isManuallyControlled) {
            showPopper();
          }
        };

        // support hover and click interaction
        const onClickProps = {
          onClick: onToggle || (isManuallyControlled ? handleClose : showPopper),
        };

        const onHoverProps = {
          onMouseLeave: handleClose,
          onMouseEnter: handleShow,
        };

        const blurFocusProps = {
          onBlur: handleClose,
          onFocus: handleShow,
        };

        return (
          <>
            {disableBlur && shouldShow && (
              <DismissOnOutsideClick enabled onClose={handleClose} ignoreRefs={ignoreRefs} />
            )}
            {popoverRef.current && (
              <GrafanaPopover
                {...popperProps}
                show={shouldShow}
                {...rest}
                wrapperClassName={classnames(styles.popover, wrapperClassName)}
                referenceElement={popoverRef.current}
                renderArrow={arrow}
                // Blur closes the card, but it also steals focus from interactive content.
                // When blur is disabled, clicks outside the card still dismiss it.
                {...(disableBlur ? {} : blurFocusProps)}
                // if we want hover interaction we have to make sure we add the leave / enter handlers
                {...(showOnHover ? onHoverProps : {})}
                hidePopper={handleClose}
              />
            )}

            {cloneElement(children, {
              ref: popoverRef,
              onFocus: handleShow,
              onBlur: disableBlur ? undefined : handleClose,
              tabIndex: 0,
              // make sure we pass the correct interaction handlers here to the element we want to interact with
              ...(showOnHover ? onHoverProps : {}),
              // Only add click handling if we have onToggle or not manually controlled
              ...(showOnClick && (onToggle || !isManuallyControlled) ? onClickProps : {}),
            })}
          </>
        );
      }}
    </PopoverController>
  );
};

function DismissOnOutsideClick({
  enabled,
  onClose,
  ignoreRefs,
}: {
  enabled: boolean;
  onClose: () => void;
  ignoreRefs: Array<RefObject<HTMLElement | null>>;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (ignoreRefs.some((ref) => ref.current?.contains(target))) {
        return;
      }

      onCloseRef.current();
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [enabled, ignoreRefs]);

  return null;
}

const getStyles = (theme: GrafanaTheme2) => ({
  popover: css({
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z3,
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  card: {
    body: css({
      padding: theme.spacing(1),
    }),
    header: css({
      padding: theme.spacing(1),
      background: theme.colors.background.secondary,
      borderBottom: `solid 1px ${theme.colors.border.medium}`,
    }),
    footer: css({
      padding: theme.spacing(0.5, 1),
      background: theme.colors.background.secondary,
      borderTop: `solid 1px ${theme.colors.border.medium}`,
    }),
  },
});
