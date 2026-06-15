export class Event {
  constructor(
    public readonly id: string,
    public title: string,
    public readonly communityId: string,
    public startTime: Date,
    public endTime: Date,
    public conferenceLink: string,
    private attendeeIds: Set<string> = new Set(), // Domain representation of the join table
  ) {}

  addAttendee(userId: string) {
    this.attendeeIds.add(userId);
  }

  getAttendees(): string[] {
    return Array.from(this.attendeeIds);
  }
}
