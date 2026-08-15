const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  const apiKey =
    event.headers["x-profile-key"] ||
    event.headers["X-Profile-Key"];

  if (
    !process.env.PROFILE_API_KEY ||
    apiKey !== process.env.PROFILE_API_KEY
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Unauthorized"
      })
    };
  }

  const username = String(
    event.queryStringParameters?.username || ""
  )
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Username is required"
      })
    };
  }

  const store = getStore("purchase-stats");

  const stats = await store.get(
    `user-${username}`,
    {
      type: "json"
    }
  );

  const result = stats || {
    starsPurchases: 0,
    premiumPurchases: 0,
    totalRub: 0
  };

  return {
    statusCode: 200,

    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },

    body: JSON.stringify({
      username,

      starsPurchases:
        Number(result.starsPurchases || 0),

      premiumPurchases:
        Number(result.premiumPurchases || 0),

      totalRub:
        Number(result.totalRub || 0)
    })
  };
};
