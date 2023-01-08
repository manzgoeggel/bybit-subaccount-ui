import { Asset } from "../PositionTable";

interface AmountProps {
	amount: string;
	setAmount: (value: string) => void;
	asset: Asset;
}

export default function Amount({ amount, setAmount, asset }: AmountProps) {
	return (
		<div className="w-full">
			<label htmlFor="price" className="block text-sm font-medium text-gray-700">
				Amount
			</label>
			<div className="relative mt-1 rounded-md shadow-sm">
				<input
					type="text"
					name="price"
					value={amount}
					onChange={(e) => {
						setAmount(e.target.value);
					}}
					onPaste={(e) => {
						e.preventDefault();
						setAmount(e?.clipboardData.getData("Text"));
					}}
					id="price"
					className="block w-full rounded-md border-gray-300 pl-3  pr-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					placeholder="0.00"
					aria-describedby="price-currency"
				/>
				<div className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-16">
					<span
						onClick={() => {
							setAmount(`${Number(asset === undefined ?  "0" : asset.availableBalance).toFixed(2)}`);
						}}
						className="text-indigo-500 hover:opacity-50 transition-all duration-150 sm:text-sm"
					>
						All
					</span>
				</div>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
					<span className="text-gray-500 sm:text-sm" id="price-currency">
						{asset === undefined ? "" : asset.coin}
					</span>
				</div>
			</div>
		</div>
	);
}
