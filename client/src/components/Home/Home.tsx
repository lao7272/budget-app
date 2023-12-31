import { useEffect, useState } from 'react';
import { Amount } from '../../Types';
import Axios from "../../api/Axios";
import DisplayLists from '../DisplayLists/DisplayLists';
import Slider from '../Slider/Slider';
import useDate from '../../hooks/useDate';


const getSum = (type: string, data: Amount[]) => {
    const nums = data
        .flatMap((a: Amount) => a.type === type && a.amount)
        .filter((a: number | Boolean) => typeof a === "number");
    let calculateSum = 0;
    for (const num of nums) {
        if (typeof num === "boolean") continue;
        calculateSum += num
    }
    return calculateSum;
}
const filterByMonth = (amountArray: Amount[], date: Date | undefined) => {
    const newAmountArray = amountArray.filter(a => new Date(a.timestamp).getMonth() === date?.getMonth() && new Date(a.timestamp).getFullYear() === date?.getFullYear());
    return newAmountArray;
}
function Home() {
    const [data, setData] = useState<Amount[]>([]);
    const [amountArray, setAmountArray] = useState<Amount[]>([]);
    const [budget, setBudget] = useState<number>(0);
    const [expense, setExpense] = useState<number>(0);
    const [loading, setLoading] = useState<Boolean>(true);
    const date = useDate()?.date;
    
    useEffect(() => {
        const getAmount = async () => {
            try {
                const accessToken = localStorage.getItem("accessToken");
                const amount = await Axios.get("/amount", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`
                    }
                });
                const { amountArray } = amount.data;
                if (!amount.data || !amountArray) return setLoading(false);
                const filteredAmountArray = filterByMonth(amountArray, date);
                setData(amountArray);
                setBudget(getSum("budget", filteredAmountArray));
                setExpense(getSum("expense", filteredAmountArray));
                setAmountArray(filteredAmountArray);
                setLoading(false);
            } catch (err) {
                console.log(err);
            }
        }
        getAmount();
    }, [date]);
    useEffect(() => {
        const filteredAmountArray = filterByMonth(data, date);
        setBudget(getSum("budget", filteredAmountArray));
        setExpense(getSum("expense", filteredAmountArray));
        setAmountArray(filteredAmountArray);
    }, [date, data]);
    async function postAmount(newAmount: Amount) {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await Axios.post("/amount", newAmount, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                withCredentials: true
            });
        } catch (err) {
            console.log(err);
        }
    }
    async function deleteFromDB(id: string) {
        try {
            const accessToken = localStorage.getItem("accessToken");
            await Axios.delete(`/amount/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                withCredentials: true
            });
        } catch (err) {
            console.log(err);
        }
    }
    function handleSetBudget(newBudget: number) {
        setBudget(prev => prev + newBudget);
    }
    function handleSetExpense(newExpense: number) {
        setExpense(prev => prev + newExpense);
    }
    function handleSetBudgetArray(newAmount: Amount) {
        setAmountArray(prev => [...prev, newAmount]);
        postAmount(newAmount);
    }
    function deleteAmount(id: string, type: string, amount: number) {
        setAmountArray(prev => {
            const newArray = prev.filter(a => a.id !== id);
            return newArray;
        });
        if (type === "budget") {
            setBudget(prev => prev - amount);
        } else {
            setExpense(prev => prev - amount);
        }
        deleteFromDB(id);
    }
    if (loading) return <div className='loader'></div>
    return (
        <>

            <Slider budget={budget} expense={expense} amountArray={amountArray} />
            <DisplayLists
                amountArray={amountArray}
                deleteAmount={deleteAmount}
                setAmountArray={setAmountArray}
                setBudget={setBudget}
                setExpense={setExpense}
                handleSetBudget={handleSetBudget}
                handleSetExpense={handleSetExpense}
                handleSetAmountsArray={handleSetBudgetArray}
            />
        </>
    );
}

export default Home;

