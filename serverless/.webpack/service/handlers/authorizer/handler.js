module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./handlers/authorizer/handler.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./handlers/authorizer/handler.js":
/*!****************************************!*\
  !*** ./handlers/authorizer/handler.js ***!
  \****************************************/
/*! exports provided: handler */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "handler", function() { return handler; });
/*
* Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
*
*     http://aws.amazon.com/apache2.0/
*
* or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
async function handler(event) {
  //@TODO: Implement proper token decryption
  if (!event.authorizationToken.startsWith('TEMP_ALLOW')) {
    throw new Error("Unauthorized");
  }

  const user = decodeToken(event.authorizationToken); // if the token is valid, a policy must be generated which will allow or deny access to the client
  // if access is denied, the client will receive a 403 Access Denied response
  // if access is allowed, API Gateway will proceed with the backend integration configured on the method that was called
  // build apiOptions for the AuthPolicy

  var apiOptions = {};
  var tmp = event.methodArn.split(':');
  var apiGatewayArnTmp = tmp[5].split('/');
  var awsAccountId = tmp[4];
  apiOptions.region = tmp[3];
  apiOptions.restApiId = apiGatewayArnTmp[0];
  apiOptions.stage = apiGatewayArnTmp[1]; // this function must generate a policy that is associated with the recognized principal user identifier.
  // depending on your use case, you might store policies in a DB, or generate them on the fly
  // keep in mind, the policy is cached for 5 minutes by default (TTL is configurable in the authorizer)
  // and will apply to subsequent calls to any method/resource in the RestApi
  // made with the same token

  var policy = new AuthPolicy(user.user_id, awsAccountId, apiOptions); // All authentication is presumably through the same endpoint, so we can allow access to all lambdas

  policy.allowAllMethods(); // finally, build the policy

  var authResponse = policy.build(); // new! -- add additional key-value pairs
  // these are made available by APIGW like so: $context.authorizer.<key>
  // additional context is cached

  authResponse.context = {};
  return authResponse;
}
;

function decodeToken(token) {
  //@TODO: Assuming they do use a JWT approach we will need WS2's secret key here.
  // For now just pull the id out of their auth token
  return {
    user_id: token.split("TEMP_ALLOW_")[1]
  };
}
/**
 * AuthPolicy receives a set of allowed and denied methods and generates a valid
 * AWS policy for the API Gateway authorizer. The constructor receives the calling
 * user principal, the AWS account ID of the API owner, and an apiOptions object.
 * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
 * stage that calls should be allowed/denied for. For example
 * {
 *   restApiId: "xxxxxxxxxx",
 *   region: "us-east-1",
 *   stage: "dev"
 * }
 *
 * var testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
 * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
 * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
 * context.succeed(testPolicy.build());
 *
 * @class AuthPolicy
 * @constructor
 */


function AuthPolicy(principal, awsAccountId, apiOptions) {
  /**
     * The AWS account id the policy will be generated for. This is used to create
     * the method ARNs.
     *
     * @property awsAccountId
     * @type {String}
     */
  this.awsAccountId = awsAccountId;
  /**
     * The principal used for the policy, this should be a unique identifier for
     * the end user.
     *
     * @property principalId
     * @type {String}
     */

  this.principalId = principal;
  /**
     * The policy version used for the evaluation. This should always be "2012-10-17"
     *
     * @property version
     * @type {String}
     * @default "2012-10-17"
     */

  this.version = "2012-10-17";
  /**
     * The regular expression used to validate resource paths for the policy
     *
     * @property pathRegex
     * @type {RegExp}
     * @default '^\/[/.a-zA-Z0-9-\*]+$'
     */

  this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$'); // these are the internal lists of allowed and denied methods. These are lists
  // of objects and each object has 2 properties: A resource ARN and a nullable
  // conditions statement.
  // the build method processes these lists and generates the approriate
  // statements for the final policy

  this.allowMethods = [];
  this.denyMethods = [];

  if (!apiOptions || !apiOptions.restApiId) {
    this.restApiId = "*";
  } else {
    this.restApiId = apiOptions.restApiId;
  }

  if (!apiOptions || !apiOptions.region) {
    this.region = "*";
  } else {
    this.region = apiOptions.region;
  }

  if (!apiOptions || !apiOptions.stage) {
    this.stage = "*";
  } else {
    this.stage = apiOptions.stage;
  }
}

;
/**
 * A set of existing HTTP verbs supported by API Gateway. This property is here
 * only to avoid spelling mistakes in the policy.
 *
 * @property HttpVerb
 * @type {Object}
 */

AuthPolicy.HttpVerb = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  HEAD: "HEAD",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  ALL: "*"
};

AuthPolicy.prototype = function () {
  /**
   * Adds a method to the internal lists of allowed or denied methods. Each object in
   * the internal list contains a resource ARN and a condition statement. The condition
   * statement can be null.
   *
   * @method addMethod
   * @param {String} The effect for the policy. This can only be "Allow" or "Deny".
   * @param {String} he HTTP verb for the method, this should ideally come from the
   *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
   * @param {String} The resource path. For example "/pets"
   * @param {Object} The conditions object in the format specified by the AWS docs.
   * @return {void}
   */
  var addMethod = function (effect, verb, resource, conditions) {
    if (verb !== "*" && !AuthPolicy.HttpVerb.hasOwnProperty(verb)) {
      throw new Error("Invalid HTTP verb " + verb + ". Allowed verbs in AuthPolicy.HttpVerb");
    }

    if (!this.pathRegex.test(resource)) {
      throw new Error("Invalid resource path: " + resource + ". Path should match " + this.pathRegex);
    }

    var cleanedResource = resource;

    if (resource.substring(0, 1) === "/") {
      cleanedResource = resource.substring(1, resource.length);
    }

    var resourceArn = "arn:aws:execute-api:" + this.region + ":" + this.awsAccountId + ":" + this.restApiId + "/" + this.stage + "/" + verb + "/" + cleanedResource;

    if (effect.toLowerCase() === "allow") {
      this.allowMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      });
    } else if (effect.toLowerCase() === "deny") {
      this.denyMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      });
    }
  };
  /**
   * Returns an empty statement object prepopulated with the correct action and the
   * desired effect.
   *
   * @method getEmptyStatement
   * @param {String} The effect of the statement, this can be "Allow" or "Deny"
   * @return {Object} An empty statement object with the Action, Effect, and Resource
   *                  properties prepopulated.
   */


  var getEmptyStatement = function (effect) {
    effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
    var statement = {};
    statement.Action = "execute-api:Invoke";
    statement.Effect = effect;
    statement.Resource = [];
    return statement;
  };
  /**
   * This function loops over an array of objects containing a resourceArn and
   * conditions statement and generates the array of statements for the policy.
   *
   * @method getStatementsForEffect
   * @param {String} The desired effect. This can be "Allow" or "Deny"
   * @param {Array} An array of method objects containing the ARN of the resource
   *                and the conditions for the policy
   * @return {Array} an array of formatted statements for the policy.
   */


  var getStatementsForEffect = function (effect, methods) {
    var statements = [];

    if (methods.length > 0) {
      var statement = getEmptyStatement(effect);

      for (var i = 0; i < methods.length; i++) {
        var curMethod = methods[i];

        if (curMethod.conditions === null || curMethod.conditions.length === 0) {
          statement.Resource.push(curMethod.resourceArn);
        } else {
          var conditionalStatement = getEmptyStatement(effect);
          conditionalStatement.Resource.push(curMethod.resourceArn);
          conditionalStatement.Condition = curMethod.conditions;
          statements.push(conditionalStatement);
        }
      }

      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement);
      }
    }

    return statements;
  };

  return {
    constructor: AuthPolicy,

    /**
     * Adds an allow "*" statement to the policy.
     *
     * @method allowAllMethods
     */
    allowAllMethods: function () {
      addMethod.call(this, "allow", "*", "*", null);
    },

    /**
     * Adds a deny "*" statement to the policy.
     *
     * @method denyAllMethods
     */
    denyAllMethods: function () {
      addMethod.call(this, "deny", "*", "*", null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
     * methods for the policy
     *
     * @method allowMethod
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @return {void}
     */
    allowMethod: function (verb, resource) {
      addMethod.call(this, "allow", verb, resource, null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of denied
     * methods for the policy
     *
     * @method denyMethod
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @return {void}
     */
    denyMethod: function (verb, resource) {
      addMethod.call(this, "deny", verb, resource, null);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
     * methods and includes a condition for the policy statement. More on AWS policy
     * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
     *
     * @method allowMethodWithConditions
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @param {Object} The conditions object in the format specified by the AWS docs
     * @return {void}
     */
    allowMethodWithConditions: function (verb, resource, conditions) {
      addMethod.call(this, "allow", verb, resource, conditions);
    },

    /**
     * Adds an API Gateway method (Http verb + Resource path) to the list of denied
     * methods and includes a condition for the policy statement. More on AWS policy
     * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
     *
     * @method denyMethodWithConditions
     * @param {String} The HTTP verb for the method, this should ideally come from the
     *                 AuthPolicy.HttpVerb object to avoid spelling mistakes
     * @param {string} The resource path. For example "/pets"
     * @param {Object} The conditions object in the format specified by the AWS docs
     * @return {void}
     */
    denyMethodWithConditions: function (verb, resource, conditions) {
      addMethod.call(this, "deny", verb, resource, conditions);
    },

    /**
     * Generates the policy document based on the internal lists of allowed and denied
     * conditions. This will generate a policy with two main statements for the effect:
     * one statement for Allow and one statement for Deny.
     * Methods that includes conditions will have their own statement in the policy.
     *
     * @method build
     * @return {Object} The policy object that can be serialized to JSON.
     */
    build: function () {
      if ((!this.allowMethods || this.allowMethods.length === 0) && (!this.denyMethods || this.denyMethods.length === 0)) {
        throw new Error("No statements defined for the policy");
      }

      var policy = {};
      policy.principalId = this.principalId;
      var doc = {};
      doc.Version = this.version;
      doc.Statement = [];
      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Allow", this.allowMethods));
      doc.Statement = doc.Statement.concat(getStatementsForEffect.call(this, "Deny", this.denyMethods));
      policy.policyDocument = doc;
      return policy;
    }
  };
}();

/***/ })

/******/ });
//# sourceMappingURL=handler.js.map