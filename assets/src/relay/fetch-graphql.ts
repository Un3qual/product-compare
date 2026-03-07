export async function fetchGraphQL(query: string, variables: Record<string, unknown>) {
  let response: Response;

  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}/api/graphql`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ query, variables })
    });
  } catch (error) {
    throw new Error(`Network request failed: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`GraphQL request failed (${response.status}): ${responseBody}`);
  }

  return response.json();
}
