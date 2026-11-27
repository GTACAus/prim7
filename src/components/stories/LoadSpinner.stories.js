import { fn, expect, userEvent, within } from "storybook/test";
import LoadSpinner from "@/components/ui/LoadSpinner.vue";

export default {
  title: "UI/LoadSpinner",
  component: LoadSpinner,
  tags: ["autodocs"],
  args: { size: "72px", label: "Loading", showLabel: true },
  argTypes: {
    size: { control: "text" },
    label: { control: "text" },
    showLabel: { control: "boolean" },
  },
};

export const WithLabel = {
  args: { showLabel: true },
};
export const WithoutLabel = {
  args: { showLabel: false },
};
