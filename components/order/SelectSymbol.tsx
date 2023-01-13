import { Fragment, useState, useEffect, useMemo } from "react";
import { SpotClientV3, ContractClient, } from "bybit-api";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Combobox } from "@headlessui/react";



function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

export interface Symbol {
    symbol: string;
    bidPrice: string;
    askPrice: string;
    lastPrice: string;
    lastTickDirection: string;
    prevPrice24h: string;
    price24hPcnt: string;
    highPrice24h: string;
    lowPrice24h: string;
    prevPrice1h: string;
    markPrice: string;
    indexPrice: string;
    openInterest: string;
    turnover24h: string;
    volume24h: string;
    fundingRate: string;
    nextFundingTime: string;
    predictedDeliveryPrice: string;
    basisRate: string;
    deliveryFeeRate: string;
    deliveryTime: string;
}
interface SelectSymbolProps {
    selectedSymbol: Symbol | null;
    setSelectedSymbol: (val: Symbol | null) => void;
	symbols: Symbol[];
}
export function SelectSymbol({selectedSymbol,setSelectedSymbol, symbols}: SelectSymbolProps) {
	const [query, setQuery] = useState("");

    useEffect(() => {
        console.log({selectedSymbol});
    },[selectedSymbol])


	const filteredSymbols = useMemo(() => {
        return query === ""
        ? symbols
        : symbols.filter((symbol_) => {
                return symbol_.symbol.toLowerCase().includes(query.toLowerCase());
          });
    }, [symbols, query]);
		

	return (
		<Combobox as="div" value={selectedSymbol} onChange={setSelectedSymbol}>
			<Combobox.Label className="block text-xs font-medium text-gray-700">Ticker</Combobox.Label>
			<div className="relative mt-1">
				<Combobox.Input
					className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-xs"
					onChange={(event) => setQuery(event.target.value)}
					displayValue={(symbol_: Symbol) => symbol_?.symbol}
				/>
				<Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
					<ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
				</Combobox.Button>

				{filteredSymbols.length > 0 && (
					<Combobox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-xs text-gray-700">
						{filteredSymbols.map((symbol: Symbol) => (
							<Combobox.Option
								key={symbol.symbol}
								value={symbol}
								className={({ active }) =>
									classNames("relative cursor-default select-none py-2 pl-3 pr-9", active ? "bg-indigo-600 text-white" : "text-gray-900")
								}
							>
								{({ active, selected }) => (
									<>
										 <div className="flex items-center">
											{/*<img src={symbol.imageUrl} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />*/}
											<span className={classNames("ml-3 truncate")}>{symbol.symbol}</span>
										</div> 

										{selected && (
											<span
												className={classNames(
													"absolute inset-y-0 right-0 flex items-center pr-4",
													active ? "text-white" : "text-indigo-600"
												)}
											>
												<CheckIcon className="h-5 w-5" aria-hidden="true" />
											</span>
										)}
									</>
								)}
							</Combobox.Option>
						))}
					</Combobox.Options>
				)}
			</div>
		</Combobox>
	);
}
