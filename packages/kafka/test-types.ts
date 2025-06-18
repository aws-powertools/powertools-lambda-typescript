import { kafkaConsumer } from './src/consumer';

const config = {
  key: { type: 'json' as const },
  value: { type: 'json' as const },
};

export const handler = kafkaConsumer(
  async (event) => {
    for (const record of event.records) {
      console.log(record.key, record.value);
    }
  },
  {
    key: { type: 'json' },
    value: { type: 'json' },
  }
);
