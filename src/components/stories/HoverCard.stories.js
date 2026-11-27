import { fn, expect, userEvent, within } from "storybook/test";
import Card from "@/components/homepage/Card.vue";

export default {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    number: "Lesson #",
    subtitle: "Title",
    to: "/lesson2",
    description: "Lesson description",
    experiment: "Lesson experiment",
    onClick: fn(),
  },
  argTypes: {
    "lesson-number": { control: "text" },
    title: { control: "text" },
    to: { control: "text" },
    description: { control: "text" },
    experiment: { control: "text" },
  },
};

export const Default = {
  args: {
    number: "Lesson #",
    subtitle: "Title",
    to: "/lesson2",
    description: "Lesson description",
    experiment: "Lesson experiment",
  },
};

// A `to` prop renders a <RouterLink>, which is an <a>
export const LinkToView = {
  args: { content: "Go to lesson 2", to: "/lesson2" },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link");
    await expect(link).toHaveAttribute("href", "/lesson2");
  },
};
