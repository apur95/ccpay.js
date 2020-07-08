import { logger } from '../common/logger';
import { BasicChannel } from './BasicChannel';
import { isRpcEvent, isRpcResponse, } from './JsonRpc';
// inject noop global channel
if (typeof window !== 'undefined') {
    window.CCPayNativeClientCallJS = () => null;
}
/**
 * Native Channel
 */
export class NativeChannel extends BasicChannel {
    constructor(requestChannel, logger, env) {
        super();
        this.log = logger;
        this.requestChannel = requestChannel;
        this.env = env;
        // replace global callback channel
        window.CCPayNativeClientCallJS = this.CCPayNativeClientCallJS.bind(this);
    }
    /**
     * 将数据类型统一为 string
     */
    _dataToString(data) {
        return JSON.stringify(data);
    }
    postMessage(data) {
        var _a, _b, _c;
        const requestChannel = this.requestChannel;
        if (this.env.isIOS) {
            this.log.debug(`NativeChannel send to ios ${requestChannel}`);
            if ((_c = (_b = (_a = window.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b[requestChannel]) === null || _c === void 0 ? void 0 : _c.postMessage) {
                window.webkit.messageHandlers[requestChannel].postMessage(data);
            }
            else {
                const iframe = document.createElement('iframe');
                iframe.setAttribute('src', `ccpay://${requestChannel}?data=${this._dataToString(data)}`);
                iframe.setAttribute('style', 'display: none');
                document.body.appendChild(iframe);
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 100);
            }
        }
        else if (this.env.isAndroid) {
            this.log.debug(`NativeChannel send to android ${requestChannel}`);
            window[requestChannel].postMessage(this._dataToString(data));
        }
        else if (this.env.isElectron) {
            this.log.debug(`NativeChannel send to electron ${requestChannel}`);
            window[requestChannel].postMessage(this._dataToString(data));
        }
        else {
            this.log.info(`
        Development runtime environment, no data will be sent.
        You may create mock response like this in console:
        NativeChannel.response(JSON.stringify(JSON.stringify( { jsonrpc: '${data.jsonrpc}', id: '${data.id}', result: your expected response object } )))
      `);
        }
    }
    CCPayNativeClientCallJS(msg) {
        let rpc;
        if (typeof msg === 'string') {
            try {
                rpc = JSON.parse(msg);
                logger.debug('CCPayNativeClientResponse received message:', msg);
            }
            catch (err) {
                logger.error('CCPayNativeClientResponse parse message JSON failed.', err);
                return;
            }
        }
        else {
            rpc = msg;
        }
        if (isRpcEvent(rpc)) {
            this.emit(rpc.method, rpc.params);
        }
        else if (isRpcResponse(rpc)) {
            const { id, error, result } = rpc;
            const responsePromise = this.responsePromiseHolder[id];
            delete this.responsePromiseHolder[id];
            if (!responsePromise)
                return logger.error('CCPayNativeClientResponse can not find promise for message:', id);
            if ((Date.now() - responsePromise.createdAt.getTime()) > 5000)
                logger.warn('CCPayNativeClientResponse take too long(more than 5000ms):', responsePromise.payload);
            logger.debug('CCPayNativeClientResponse find and delete promise:', id);
            if (error) {
                logger.error('CCPayNativeClientResponse error:', error);
                responsePromise.reject(error);
            }
            else {
                logger.debug('CCPayNativeClientResponse result:', result);
                responsePromise.resolve(result);
            }
        }
    }
}
