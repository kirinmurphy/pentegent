# Coding Conventions

- Use constants instead of magic strings/numbers
- Use config objects with named properties for function args (especially >2 params or non-self-documenting params)
- Prefer functions with closures over classes for stateful modules
- Large helper pure functions go in their own files; small helpers can stay below the main export
- Extract business rules (thresholds, header lists, patterns) into config objects separate from processing logic
- Avoid procedural comments (e.g. "// Get the user", "// Loop through items"). Comments are only for: TODOs, explanations of non-obvious logic, and lint rule exceptions
