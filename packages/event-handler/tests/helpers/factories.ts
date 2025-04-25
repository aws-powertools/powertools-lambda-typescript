const onPublishEventFactory = (
  events: Array<{ payload: unknown; id: string }> = [
    {
      payload: {
        event_1: 'data_1',
      },
      id: '5f7dfbd1-b8ff-4c20-924e-23b42db467a0',
    },
    {
      payload: {
        event_2: 'data_2',
      },
      id: 'ababdf65-a3e6-4c1d-acd3-87466eab433c',
    },
    {
      payload: {
        event_3: 'data_3',
      },
      id: '8bb2983a-0967-45a0-8243-0aeb8c83d80e',
    },
  ],
  channel = {
    path: '/request/channel',
    segments: ['request', 'channel'],
  }
) => ({
  identity: null,
  result: null,
  request: {
    headers: {
      key: 'value',
    },
    domainName: null,
  },
  info: {
    channel,
    channelNamespace: {
      name: channel.segments[0],
    },
    operation: 'PUBLISH',
  },
  error: null,
  prev: null,
  stash: {},
  outErrors: [],
  events,
});

const onSubscribeEventFactory = (
  channel = {
    path: '/request/channel',
    segments: ['request', 'channel'],
  }
) => ({
  identity: null,
  result: null,
  request: {
    headers: {
      key: 'value',
    },
    domainName: null,
  },
  info: {
    channel,
    channelNamespace: {
      name: channel.segments[0],
    },
    operation: 'PUBLISH',
  },
  error: null,
  prev: null,
  stash: {},
  outErrors: [],
  events: null,
});

export { onPublishEventFactory, onSubscribeEventFactory };
