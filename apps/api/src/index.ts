import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const { default: app } = await import("./server.js");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`CanIClone API running on http://localhost:${PORT}`);
});