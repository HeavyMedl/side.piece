var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "irule"));

// Register a callback to know if driver creation was successful:
driver.onCompleted = function() {
  // proceed with using the driver, it was successfully instantiated
};

// Register a callback to know if driver creation failed.
// This could happen due to wrong credentials or database unavailability:
driver.onError = function(error) {
  console.log('Driver instantiation failed', error);
};

module.exports = driver;
