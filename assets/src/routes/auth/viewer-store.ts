import {
  commitLocalUpdate,
  type Environment,
  type RecordSourceProxy
} from "relay-runtime";
import type { RootViewer } from "../root/loader";

export function setRootViewer(environment: Environment, viewer: RootViewer) {
  commitLocalUpdate(environment, (store) => {
    const viewerRecord = store.get(viewer.id) ?? store.create(viewer.id, "User");

    viewerRecord.setValue(viewer.id, "id");
    viewerRecord.setValue(viewer.email, "email");
    viewerRecord.setValue(viewer.isOperator, "isOperator");
    store.getRoot().setLinkedRecord(viewerRecord, "viewer");
  });
}

export function clearRootViewer(environment: Environment) {
  commitLocalUpdate(environment, (store: RecordSourceProxy) => {
    // Relay rejects setLinkedRecord(null), so clear the root link with a scalar null write.
    store.getRoot().setValue(null, "viewer");
  });
}
