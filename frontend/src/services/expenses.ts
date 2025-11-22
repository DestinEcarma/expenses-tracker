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

interface EditedCategory {
	id: string;
	name: string;
	icon: string;
}

interface ExpensesOverview {
	dailyExpense: Expense[];
	categories: Category[];
}

interface Transaction {
	id: string;
	amount: number;
	note?: string;
	date: Date;
}

async function addCategory(name: string, icon: string): Promise<Category> {
	return api.post("/expenses/categories/create", { name, icon }).then((response) => response.data);
}

async function editCategory(id: string, name: string, icon: string): Promise<EditedCategory> {
	return api.patch(`/expenses/categories/${id}/edit`, { name, icon }).then((response) => response.data);
}

async function deleteCategory(id: string): Promise<void> {
	return api.delete(`/expenses/categories/${id}/delete`).then(() => undefined);
}

async function getExpensesOverview(start: Date, end: Date): Promise<ExpensesOverview> {
	return api.get("/expenses/list-overview", { params: { start, end } }).then((response) => response.data);
}

async function addTransaction(id: string, amount: number, date: Date, note?: string): Promise<Transaction> {
	return api
		.post(`/expenses/categories/${id}/transactions/create`, { amount, note, date })
		.then((response) => response.data);
}

async function editTransaction(
	categoryId: string,
	transactionId: string,
	amount: number,
	date: Date,
	note?: string,
): Promise<Transaction> {
	return api
		.patch(`/expenses/categories/${categoryId}/transactions/${transactionId}/edit`, { amount, date, note })
		.then((response) => response.data);
}

async function deleteTransaction(categoryId: string, transactionId: string): Promise<void> {
	return api.delete(`/expenses/categories/${categoryId}/transactions/${transactionId}/delete`).then(() => undefined);
}

async function getTransactions(id: string, start: Date, end: Date): Promise<Transaction[]> {
	return api
		.get(`/expenses/categories/${id}/transactions/list`, { params: { start, end } })
		.then((response) => response.data);
}

export {
	addCategory,
	editCategory,
	deleteCategory,
	getExpensesOverview,
	addTransaction,
	editTransaction,
	deleteTransaction,
	getTransactions,
	type Expense,
	type Category,
	type EditedCategory,
	type ExpensesOverview as ExpenseOverview,
	type Transaction,
};
