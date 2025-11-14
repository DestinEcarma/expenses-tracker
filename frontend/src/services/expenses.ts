import { api } from ".";

interface Expense {
	date: string;
	amount: number;
}

interface Category {
	id: string;
	name: string;
	icon: string;
	amount: number;
	transactions: number;
}

interface ExpensesOverview {
	dailyExpense: Expense[];
	categories: Category[];
}

async function addCategory(name: string, icon: string): Promise<Category> {
	return api.post("/expenses/categories", { name, icon }).then((response) => response.data);
}

async function getExpensesOverview(start: Date, end: Date): Promise<ExpensesOverview> {
	return api.get("/expenses", { params: { start, end } }).then((response) => response.data);
}

export { addCategory, getExpensesOverview, type Expense, type Category, type ExpensesOverview as ExpenseOverview };
