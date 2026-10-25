import { task } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message?: string } = {}) => {
    console.log("Trigger.dev task executed:", payload.message || "Hello World");
    return {
      message: payload.message || "Hello World",
      timestamp: new Date().toISOString(),
    };
  },
});
