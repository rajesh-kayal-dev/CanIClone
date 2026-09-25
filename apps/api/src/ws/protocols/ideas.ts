export type IdeasClientMessage = {
  type: "chat" | "analyze" | "research" | "prompt" | "mvp";
  requestId?: string;
  ideaId?: string;
  anonymousUserId?: string;
  content?: string;
  retry?: boolean;
};
