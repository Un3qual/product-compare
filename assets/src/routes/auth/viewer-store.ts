import {
  commitLocalUpdate,
  type Environment,
  type RecordSourceProxy
} from "relay-runtime";

type RootViewer = {
  id: string;
  email: string;
};

export function setRootViewer(environment: Environment, viewer: RootViewer) {
  commitLocalUpdate(environment, (store) => {
    const viewerRecord = store.get(viewer.id) ?? store.create(viewer.id, "User");

    viewerRecord.setValue(viewer.id, "id");
    viewerRecord.setValue(viewer.email, "email");
    store.getRoot().setLinkedRecord(viewerRecord, "viewer");
  });
}

export function clearRootViewer(environment: Environment) {
  commitLocalUpdate(environment, (store: RecordSourceProxy) => {
    store.getRoot().setValue(null, "viewer");
  });
}
