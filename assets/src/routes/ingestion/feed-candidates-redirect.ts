import { redirect } from "react-router";
import { routeMetaDescriptors } from "$frontend/seo";

export function meta() {
  return routeMetaDescriptors({
    title: "CJ programs | Product Compare",
    description:
      "Manage CJ advertiser programs through their lifecycle and inspect their observed feeds.",
  });
}

export function loader() {
  return redirect("/ingestion/cj-programs");
}
