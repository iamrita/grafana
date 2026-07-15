// Code generated - EDITING IS FUTILE. DO NOT EDIT.

export interface CommonMetadata {
	updateTimestamp: string;
	createdBy: string;
	uid: string;
	creationTimestamp: string;
	deletionTimestamp?: string;
	finalizers: string[];
	resourceVersion: string;
	generation: number;
	updatedBy: string;
	labels: Record<string, string>;
}

export const defaultCommonMetadata = (): CommonMetadata => ({
	updateTimestamp: "",
	createdBy: "",
	uid: "",
	creationTimestamp: "",
	finalizers: [],
	resourceVersion: "",
	generation: 0,
	updatedBy: "",
	labels: {},
});
