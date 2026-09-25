export type AppClientMessage = {
  type: "app.chat" | "app.research" | "app.prompt" | "app.mvp" | "app.cancel";
  requestId?: string;
  appSlug?: string;
  anonymousUserId?: string;
  content?: string;
  retry?: boolean;
};

export function isAppClientMessage(msg: { type?: unknown }): msg is AppClientMessage {
  return (
    msg.type === "app.chat" ||
    msg.type === "app.research" ||
    msg.type === "app.prompt" ||
    msg.type === "app.mvp" ||
    msg.type === "app.cancel"
  );
}
