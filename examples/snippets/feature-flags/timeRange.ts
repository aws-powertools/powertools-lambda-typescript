import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';

const document = {
  happy_hour: {
    default: false,
    rules: {
      evening_in_rome: {
        when_match: true,
        conditions: [
          {
            action: 'SCHEDULE_BETWEEN_TIME_RANGE',
            key: 'CURRENT_TIME',
            value: { START: '17:00', END: '19:00', TIMEZONE: 'Europe/Rome' },
          },
        ],
      },
    },
  },
};

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});
const happyHour = await flags.evaluate({ name: 'happy_hour', default: false });
console.log(happyHour);
