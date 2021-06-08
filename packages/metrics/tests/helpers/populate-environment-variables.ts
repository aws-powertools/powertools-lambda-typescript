const populateEnvironmentVariables = (): void => {

  process.env.POWERTOOLS_METRICS_SERVICE = 'hello-world';

};

export {
  populateEnvironmentVariables
};