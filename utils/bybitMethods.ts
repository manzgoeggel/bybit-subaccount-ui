import axios from "axios";
import crypto from "crypto";
const url = "https://api-testnet.bybit.com";
const recvWindow = 5000;
const timestamp = Date.now().toString();

function getSignature(parameters: string, secret: string, apiKey: string) {
	return crypto
		.createHmac("sha256", secret)
		.update(timestamp + apiKey + recvWindow + parameters)
		.digest("hex");
}

export async function http_request(endpoint: string, method: "POST" | "GET", data: string, secret: string, apiKey: string): Promise<any> {
	const sign = getSignature(data, secret, apiKey);
	let fullendpoint = "";
	if (method == "POST") {
		fullendpoint = url + endpoint;
	} else {
		fullendpoint = url + endpoint + "?" + data;
		data = "";
	}
	//endpoint=url+endpoint
	const config = {
		method: method,
		url: fullendpoint,
		headers: {
			"X-BAPI-SIGN-TYPE": "2",
			"X-BAPI-SIGN": sign,
			"X-BAPI-API-KEY": apiKey,
			"X-BAPI-TIMESTAMP": timestamp,
			"X-BAPI-RECV-WINDOW": `${recvWindow}`,
			"Content-Type": "application/json; charset=utf-8",
		},
		data: data,
	};

	const result = await axios(config);
	return result.data;
}

interface SubaccountApiKeyResponse {
	subUid: string;
	apiKey: string;
	secret: string;
}
export async function createNewSubAccountAPIkey(subUid: string, secret: string, apiKey: string): Promise<SubaccountApiKeyResponse> {
	const body = {
		subuid: subUid,
		readOnly: 0,

		permissions: {
			ContractTrade: ["Order", "Position"],
			Wallet: ["AccountTransfer"],
		},
	};
	const result = await http_request("/user/v3/private/create-sub-api", "POST", JSON.stringify(body), secret, apiKey);
	if (result.retMsg === "OK") {
		return {
			subUid,
			apiKey: result.result.apiKey,
			secret: result.result.secret,
		};
	}
	throw new Error(result);
}
