import chalk from "chalk";

// NO_COLOR convention: https://no-color.org/
if (process.env.NO_COLOR !== undefined) {
  chalk.level = 0;
}

// Moonwell brand color palette
export const c = {
  heading: chalk.white.bold,
  label: chalk.hex('#2474da'),        // Moonwell Blue
  value: chalk.white,
  positive: chalk.hex('#42b34d'),     // Moonwell Green
  negative: chalk.hex('#d72c2b'),     // Moonwell Red
  warning: chalk.hex('#fd6e31'),      // Re-entry Orange
  dim: chalk.gray,
  accent: chalk.hex('#2474da'),       // Moonwell Blue
  address: chalk.hex('#2474da'),      // Moonwell Blue
  error: chalk.hex('#d72c2b').bold,   // Moonwell Red
};

export const SEP_WIDTH = 62;

const ANSI_RE = /\x1b\[[0-9;]*m/g;

/** Strip ANSI escape codes for visual width measurement. */
function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, "");
}

/** Pad a string to a visual width, accounting for ANSI codes. */
function visualPad(str: string, width: number): string {
  const visual = stripAnsi(str).length;
  return str + " ".repeat(Math.max(0, width - visual));
}

export function separator(): string {
  return c.dim("\u2500".repeat(SEP_WIDTH));
}

export function header(title: string): string {
  return `\n${c.heading(title)}\n${separator()}`;
}

export function footer(): string {
  return separator();
}

export function labelValue(label: string, value: string, indent = 4): string {
  const pad = " ".repeat(indent);
  const labelStr = c.label(label);
  return `${pad}${visualPad(labelStr, 16)}${c.value(value)}`;
}

export function labelValuePair(
  label1: string,
  value1: string,
  label2: string,
  value2: string,
  indent = 4,
): string {
  const pad = " ".repeat(indent);
  const left = `${c.label(label1)}${" ".repeat(Math.max(1, 14 - label1.length))}${c.value(value1)}`;
  return `${pad}${visualPad(left, 30)}${c.label(label2)}${" ".repeat(Math.max(1, 14 - label2.length))}${c.value(value2)}`;
}

export function assetHeader(symbol: string, indent = 2): string {
  return `${" ".repeat(indent)}${c.heading(symbol)}`;
}

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function colorPct(value: number): string {
  const formatted = `${value.toFixed(2)}%`;
  if (value > 0) return c.positive(formatted);
  if (value < 0) return c.negative(formatted);
  return c.dim(formatted);
}

export function colorUsd(value: string): string {
  return c.value(value);
}
