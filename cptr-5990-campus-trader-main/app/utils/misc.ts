import {OrderStatus} from '@prisma/client'

export function round(number: number, precision: number) {
	const d = Math.pow(10, precision)
	return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
	string = string.toLowerCase()
	const wordsArray = string.split(' ')

	for (var i = 0; i < wordsArray.length; i++) {
		wordsArray[i] =
			wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
	}

	return wordsArray.join(' ')
}

export function formatList(list: Array<string>) {
	return new Intl.ListFormat('en').format(list)
}

export function formatTime(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		minute: 'numeric',
	}).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	}).format(new Date(date))
}
export function formatCurrency(number: number) {
	return new Intl.NumberFormat('en', {
		style: 'currency',
		currency: 'USD',
	}).format(number)
}

export const orderStatusLabelLookup: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'Pending',
	[OrderStatus.CONFIRMED]: 'Confirmed',
	[OrderStatus.IN_TRANSIT]: 'In Transit',
	[OrderStatus.DELIVERED]: 'Delivered',
	[OrderStatus.CANCELLED]: 'Cancelled',
}

export const orderStatusColorLookup: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'gray',
	[OrderStatus.CONFIRMED]: 'blue',
	[OrderStatus.IN_TRANSIT]: 'yellow',
	[OrderStatus.DELIVERED]: 'green',
	[OrderStatus.CANCELLED]: 'red',
}
