declare module 'jsep' {
	export class Jsep {
		static addBinaryOp(operatorName: string, precedence: number, rightToLeft?: boolean): void;
		static addUnaryOp(operatorName: string): void;
		static removeBinaryOp(operatorName: string): void;
		static removeUnaryOp(operatorName: string): void;
		static addIdentifierChar(identifierName: string): void;
		static removeIdentifierChar(identifierName: string): void;

		// TODO: fix maybe? submit upstream? pull downstream to roll our own version instead of hacking?
		static [x: string]: any;
		[x: string]: any;
	}
}
