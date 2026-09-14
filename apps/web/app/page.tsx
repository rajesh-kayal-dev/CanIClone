
import { formatCurrency } from "@monorepo-setup/utils";

export default function Home() {
    const formattedCurrency = formatCurrency(22.99);

    return (
        <>
            <p>{formattedCurrency}</p>
        </>
    )
}