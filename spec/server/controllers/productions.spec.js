const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const Production = require('../../../dist/models/production');

const getResponseFixture = require('../../fixtures/get-response-instance');
const getResponseListFixture = require('../../fixtures/get-response-instances-list');

const err = new Error('errorText');

const sandbox = sinon.sandbox.create();

let stubs;
let req;
let res;
let next;
let method;
let methodStub;

beforeEach(() => {

	stubs = {
		renderJson: sandbox.stub()
	};

});

afterEach(() => {

	sandbox.restore();

});

const createSubject = stubOverrides =>
	proxyquire('../../../dist/controllers/productions', {
		'./lib/render-json': stubs.renderJson,
		'../models/production': stubOverrides.ProductionModel
	});

const createInstance = (method, methodStub) => {

	req = httpMocks.createRequest();
	res = httpMocks.createResponse();

	next = sinon.stub();

	const ProductionModel = (method => {
		switch (method) {
			case 'new':
				return methodStub;
			case 'list':
				return sinon.stub(Production, 'list').callsFake(() => { return methodStub });
			default:
				return function () { this[method] = methodStub; };
		}
	}) (method);

	const subject = createSubject({ ProductionModel });

	const controllerFunction = `${method}Route`;

	return subject[controllerFunction](req, res, next);

};

describe('Productions controller', () => {

	describe('show method', () => {

		beforeEach(() => {

			method = 'show';

		});

		context('resolves with data', () => {

			it('will call renderJson module', done => {

				const responseFixture = getResponseFixture('production');
				methodStub = sinon.stub().resolves(responseFixture);
				createInstance(method, methodStub).then(() => {
					expect(stubs.renderJson.calledOnce).to.be.true;
					expect(stubs.renderJson.calledWithExactly(req, res, responseFixture.production)).to.be.true;
					expect(next.notCalled).to.be.true;
					done();
				});

			});

		});

		context('resolves with error', () => {

			it('will call next() with error', done => {

				methodStub = sinon.stub().rejects(err);
				createInstance(method, methodStub).then(() => {
					expect(next.calledOnce).to.be.true;
					expect(next.calledWithExactly(err)).to.be.true;
					done();
				});

			});

		});

	});

	describe('list method', () => {

		beforeEach(() => {

			method = 'list';

		});

		afterEach(() => {

			Production.list.restore();

		});

		context('resolves with data', () => {

			it('will call renderJson module', done => {

				const responseListFixture = getResponseListFixture('productions');
				methodStub = Promise.resolve(responseListFixture);
				createInstance(method, methodStub).then(() => {
					expect(stubs.renderJson.calledOnce).to.be.true;
					expect(stubs.renderJson.calledWithExactly(req, res, responseListFixture.productions)).to.be.true;
					expect(next.notCalled).to.be.true;
					done();
				});

			});

		});

		context('resolves with error', () => {

			it('will call next() with error', done => {

				methodStub = Promise.reject(err);
				createInstance(method, methodStub).then(() => {
					expect(next.calledOnce).to.be.true;
					expect(next.calledWithExactly(err)).to.be.true;
					done();
				});

			});

		});

	});

});