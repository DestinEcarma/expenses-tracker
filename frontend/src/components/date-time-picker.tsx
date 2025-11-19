import { DialogUI, DrawerUI, PopoverUI } from "./responsive-overlay";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@uidotdev/usehooks";
import { format } from "date-fns";
import * as React from "react";
import { useCallback, useState } from "react";
import { FaCalendar } from "react-icons/fa";

interface DateTimePickerProps extends Omit<React.ComponentProps<"button">, "onChange"> {
	value?: string;
	onChange?: (date: string) => void;
	calendarProps?: Omit<React.ComponentProps<typeof Calendar>, "mode" | "selected" | "onSelect">;
}

function DateTimePicker({ value, onChange, calendarProps, ...props }: DateTimePickerProps) {
	const [date, setDate] = useState<Date | undefined>(() => (value ? new Date(value) : undefined));
	const [isOpen, setIsOpen] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleDateChange = useCallback(
		(date: Date) => {
			setDate(date);
			onChange?.(date.toISOString());
		},
		[setDate, onChange],
	);

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			handleDateChange(selectedDate);
		}
	};

	const handleTimeChange = (type: "hour" | "minute" | "ampm", value: string) => {
		if (date) {
			const newDate = new Date(date);
			if (type === "hour") {
				newDate.setHours((parseInt(value) % 12) + (newDate.getHours() >= 12 ? 12 : 0));
			} else if (type === "minute") {
				newDate.setMinutes(parseInt(value));
			} else if (type === "ampm") {
				const currentHours = newDate.getHours();
				newDate.setHours(value === "PM" ? currentHours + 12 : currentHours - 12);
			}
			handleDateChange(newDate);
		}
	};

	const UI = isDesktop ? PopoverUI : DialogUI;

	return (
		<UI.Container open={isOpen} onOpenChange={setIsOpen}>
			<UI.Trigger asChild>
				<Button
					variant="outline"
					className={cn("w-full justify-between text-left font-normal", !date && "text-muted-foreground")}
					{...props}
				>
					{date ? format(date, "MM/dd/yyyy hh:mm aa") : <span>MM/DD/YYYY hh:mm aa</span>}
					<FaCalendar />
				</Button>
			</UI.Trigger>
			<UI.Content className={cn("w-auto", isDesktop && "relative p-0")}>
				{!isDesktop && (
					<UI.Header>
						<UI.Title>Select Date & Time</UI.Title>
						<UI.Description>Choose a date and time from the options below.</UI.Description>
					</UI.Header>
				)}
				<div className="sm:flex">
					<Calendar mode="single" selected={date} onSelect={handleDateSelect} {...calendarProps} />
					<div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{hours.reverse().map((hour) => (
									<Button
										key={hour}
										size="icon"
										variant={date && date.getHours() % 12 === hour % 12 ? "default" : "ghost"}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() => handleTimeChange("hour", hour.toString())}
									>
										{hour}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="icon"
										variant={date && date.getMinutes() === minute ? "default" : "ghost"}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() => handleTimeChange("minute", minute.toString())}
									>
										{minute}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea>
							<div className="flex p-2 sm:flex-col">
								{["AM", "PM"].map((ampm) => (
									<Button
										key={ampm}
										size="icon"
										variant={
											date && ((ampm === "AM" && date.getHours() < 12) || (ampm === "PM" && date.getHours() >= 12))
												? "default"
												: "ghost"
										}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() => handleTimeChange("ampm", ampm)}
									>
										{ampm}
									</Button>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>
			</UI.Content>
		</UI.Container>
	);
}

export { DateTimePicker };
