export interface OutgoingMessage {
  bubbleId: string;
  text: string;
}

/** Delivers messages to the Rainbow bubble backing a sub-group, on behalf of their author. */
export interface MessagingProviderPort {
  /** Sends the message as the user the token belongs to. Returns the provider's message id. */
  sendMessage(userToken: string, userId: string, message: OutgoingMessage): Promise<string>;
}
