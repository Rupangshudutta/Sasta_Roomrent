"use client";

import { Check, ChevronDown, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

import { controlClass } from "./control-class";
import { filterOptions, findTypeaheadIndex, type DropdownOption } from "./dropdown-options";

/**
 * Themed replacements for native <select> and <datalist>, whose popups are drawn by
 * the browser and cannot be styled.
 *
 * - `Select` picks one value from a fixed list.
 * - `Autocomplete` is a free-text input with suggestions.
 *
 * Both keep a real <input> in the form, so GET forms, server actions, FormData and
 * `useFormAction` validation work as they did with native controls. Give each one an
 * `id` and a matching <label htmlFor>.
 */

const MENU_MAX_HEIGHT = 288;
const MENU_MIN_HEIGHT_BELOW = 200;
const MENU_GAP = 8;
const TYPEAHEAD_RESET_MS = 500;

function measureMenu(anchor: HTMLElement): CSSProperties {
  const rect = anchor.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - MENU_GAP * 2;
  const above = rect.top - MENU_GAP * 2;
  const flip = below < MENU_MIN_HEIGHT_BELOW && above > below;
  return {
    position: "fixed",
    left: rect.left,
    width: rect.width,
    maxHeight: Math.min(MENU_MAX_HEIGHT, flip ? above : below),
    ...(flip
      ? { bottom: window.innerHeight - rect.top + MENU_GAP }
      : { top: rect.bottom + MENU_GAP }),
  };
}

/** Open state and viewport position of a menu; it follows its anchor on scroll and resize. */
function useFloatingMenu(
  anchorRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const isOpen = style !== null;

  const show = useCallback(() => {
    if (anchorRef.current) setStyle(measureMenu(anchorRef.current));
  }, [anchorRef]);
  const hide = useCallback(() => setStyle(null), []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !menuRef.current?.contains(target)) hide();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", show, true);
    window.addEventListener("resize", show);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", show, true);
      window.removeEventListener("resize", show);
    };
  }, [isOpen, show, hide, anchorRef, menuRef]);

  return { isOpen, style, show, hide };
}

type MenuProps = {
  id: string;
  label: string;
  style: CSSProperties;
  menuRef: RefObject<HTMLUListElement | null>;
  options: readonly DropdownOption[];
  activeIndex: number;
  selectedValue?: string;
  icon?: ReactNode;
  onActiveChange: (index: number) => void;
  onChoose: (option: DropdownOption) => void;
};

const optionId = (menuId: string, index: number) => `${menuId}-option-${index}`;

/** Portalled to <body> so overflow-hidden parents and stacking contexts cannot clip it. */
function Menu({
  id,
  label,
  style,
  menuRef,
  options,
  activeIndex,
  selectedValue,
  icon,
  onActiveChange,
  onChoose,
}: MenuProps) {
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(optionId(id, activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [id, activeIndex]);

  return createPortal(
    <ul
      ref={menuRef}
      id={id}
      role="listbox"
      aria-label={label}
      style={style}
      // Keep focus on the control while the menu is clicked or scrolled.
      onMouseDown={(event) => event.preventDefault()}
      className="rounded-card-sm border-border divide-border/70 text-ink z-50 divide-y overflow-y-auto border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
    >
      {options.map((option, index) => {
        const selected = option.value === selectedValue;
        return (
          <li
            key={`${option.value}-${option.description ?? ""}`}
            id={optionId(id, index)}
            role="option"
            aria-selected={selected}
            onClick={() => onChoose(option)}
            onMouseEnter={() => onActiveChange(index)}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors",
              index === activeIndex && "bg-primary/5",
            )}
          >
            {icon ? <span className="text-muted shrink-0">{icon}</span> : null}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate", selected ? "text-primary font-semibold" : "")}>
                {option.label}
              </span>
              {option.description ? (
                <span className="text-muted mt-0.5 block truncate text-xs">
                  {option.description}
                </span>
              ) : null}
            </span>
            {selected ? <Check className="text-primary h-4 w-4 shrink-0" aria-hidden /> : null}
          </li>
        );
      })}
    </ul>,
    document.body,
  );
}

/** Sets the value as a user edit would, so React and the form's onChange both see it. */
function setInputValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function moveIndex(key: string, current: number, count: number): number | null {
  if (key === "ArrowDown") return current < count - 1 ? current + 1 : 0;
  if (key === "ArrowUp") return current > 0 ? current - 1 : count - 1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

type SelectProps = {
  id: string;
  /** Names the list for screen readers; normally the text of the field's <label>. */
  label: string;
  name?: string;
  options: readonly DropdownOption[];
  defaultValue?: string | number | null;
  /** Adds an empty first option, shown muted in the closed control. */
  placeholder?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

export function Select({
  id,
  label,
  name,
  options,
  defaultValue,
  placeholder,
  onValueChange,
  required,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
}: SelectProps) {
  const initial = String(defaultValue ?? "");
  const [value, setValue] = useState(initial);
  const [previousInitial, setPreviousInitial] = useState(initial);
  // The default changes when a URL-driven page re-renders, e.g. after "Clear all".
  if (initial !== previousInitial) {
    setPreviousInitial(initial);
    setValue(initial);
  }

  const items = placeholder ? [{ value: "", label: placeholder }, ...options] : options;
  // Like a native <select>: an unknown or missing value falls back to the first option.
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );
  const selected = items[selectedIndex];

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const menuId = `${useId()}-menu`;
  const menu = useFloatingMenu(triggerRef, menuRef);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setValue(initial);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initial]);

  function open(index = selectedIndex) {
    setActiveIndex(index);
    menu.show();
  }

  function choose(option: DropdownOption) {
    if (inputRef.current) setInputValue(inputRef.current, option.value);
    menu.hide();
  }

  function jumpTo(character: string) {
    const now = Date.now();
    const text =
      (now - typeahead.current.at < TYPEAHEAD_RESET_MS ? typeahead.current.text : "") + character;
    typeahead.current = { text, at: now };
    const match = findTypeaheadIndex(items, text);
    if (match >= 0) open(match);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey) {
      jumpTo(event.key);
      return;
    }
    if (!menu.isOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      menu.hide();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = items[activeIndex];
      if (active) choose(active);
      else menu.hide();
      return;
    }
    const next = moveIndex(event.key, activeIndex, items.length);
    if (next !== null) {
      event.preventDefault();
      setActiveIndex(next);
    }
  }

  return (
    <div className="relative w-full">
      {/* Not type="hidden": React's onChange and form validation both skip hidden inputs. */}
      <input
        ref={inputRef}
        name={name}
        value={selected?.value ?? ""}
        onChange={(event) => {
          setValue(event.target.value);
          onValueChange?.(event.target.value);
        }}
        // useFormAction focuses the first invalid field by name; send that to the button.
        onFocus={() => triggerRef.current?.focus()}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        autoComplete="off"
        className="sr-only"
      />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={menu.isOpen}
        aria-controls={menu.isOpen ? menuId : undefined}
        aria-activedescendant={
          menu.isOpen && activeIndex >= 0 ? optionId(menuId, activeIndex) : undefined
        }
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        disabled={disabled}
        onClick={() => (menu.isOpen ? menu.hide() : open())}
        onKeyDown={onKeyDown}
        // Space activates a button on key up; the menu already handled it on key down.
        onKeyUp={(event) => {
          if (event.key === " ") event.preventDefault();
        }}
        className={cn(
          controlClass,
          "flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed",
          menu.isOpen && "border-primary ring-primary/20 ring-2",
          className,
        )}
      >
        <span className={cn("truncate", placeholder && !selected?.value && "text-muted")}>
          {selected?.label}
        </span>
        <ChevronDown
          className={cn("text-muted h-4 w-4 shrink-0 transition-transform", {
            "rotate-180": menu.isOpen,
          })}
          aria-hidden
        />
      </button>
      {menu.style ? (
        <Menu
          id={menuId}
          label={label}
          style={menu.style}
          menuRef={menuRef}
          options={items}
          activeIndex={activeIndex}
          selectedValue={selected?.value}
          onActiveChange={setActiveIndex}
          onChoose={choose}
        />
      ) : null}
    </div>
  );
}

type AutocompleteProps = {
  id: string;
  /** Names the list for screen readers; normally the text of the field's <label>. */
  label: string;
  name: string;
  options: readonly DropdownOption[];
  defaultValue?: string;
  placeholder?: string;
  /** Shown beside every suggestion, e.g. a map pin. */
  optionIcon?: ReactNode;
  className?: string;
};

export function Autocomplete({
  id,
  label,
  name,
  options,
  defaultValue = "",
  placeholder,
  optionIcon,
  className,
}: AutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = `${useId()}-menu`;
  const menu = useFloatingMenu(anchorRef, menuRef);

  const results = filterOptions(options, query);
  const expanded = menu.isOpen && results.length > 0;

  function choose(option: DropdownOption) {
    setQuery(option.value);
    setActiveIndex(-1);
    menu.hide();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (expanded) event.preventDefault();
      menu.hide();
      return;
    }
    if (event.key === "Tab") {
      menu.hide();
      return;
    }
    if (event.key === "Enter") {
      // With nothing highlighted, Enter submits the typed text as usual.
      const active = expanded ? results[activeIndex] : undefined;
      if (active) {
        event.preventDefault();
        choose(active);
      }
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!menu.isOpen) menu.show();
    if (results.length > 0) setActiveIndex(moveIndex(event.key, activeIndex, results.length) ?? -1);
  }

  return (
    <div ref={anchorRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? menuId : undefined}
        aria-activedescendant={
          expanded && activeIndex >= 0 ? optionId(menuId, activeIndex) : undefined
        }
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          menu.show();
        }}
        onFocus={menu.show}
        onClick={menu.show}
        onKeyDown={onKeyDown}
        className={cn(controlClass, query && "pr-10", className)}
      />
      {query ? (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => {
            setQuery("");
            setActiveIndex(-1);
            inputRef.current?.focus();
            menu.show();
          }}
          className="text-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      {expanded && menu.style ? (
        <Menu
          id={menuId}
          label={label}
          style={menu.style}
          menuRef={menuRef}
          options={results}
          activeIndex={activeIndex}
          icon={optionIcon}
          onActiveChange={setActiveIndex}
          onChoose={choose}
        />
      ) : null}
    </div>
  );
}
