export async function fetchGraphQL(query: string, variables: Record<string, unknown>) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/graphql`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  return response.json();
}
