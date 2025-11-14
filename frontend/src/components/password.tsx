import { FormControl } from "./ui/form";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group";
import { Eye, EyeClosed, Lock } from "lucide-react";
import { useState } from "react";

function Password({ className, ...props }: React.ComponentProps<"input">) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<InputGroup className={className}>
			<InputGroupAddon>
				<Lock />
			</InputGroupAddon>
			<FormControl>
				<InputGroupInput type={showPassword ? "text" : "password"} autoCorrect="off" autoCapitalize="off" {...props} />
			</FormControl>
			<InputGroupAddon align="inline-end">
				<InputGroupButton onClick={() => setShowPassword((value) => !value)}>
					{showPassword ? <EyeClosed /> : <Eye />}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}

export { Password };
