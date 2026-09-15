
import { formatCurrency } from "@caniclone/utils";

export default function Home() {
    const formattedCurrency = formatCurrency(22.99);

    return (
        <>
            <p>{formattedCurrency}</p>
        </>
    )
}