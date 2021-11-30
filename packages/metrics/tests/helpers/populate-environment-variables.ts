const populateEnvironmentVariables = (): void => {

  process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

};

export {
  populateEnvironmentVariables,
};