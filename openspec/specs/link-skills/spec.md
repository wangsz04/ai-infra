## ADDED Requirements

### Requirement: Script entry point
The system SHALL provide a `scripts/link-skills.mjs` entry point.

#### Scenario: Script exists
- **WHEN** user checks `scripts/link-skills.mjs`
- **THEN** the file SHALL exist and be executable

### Requirement: CLI argument parsing
The script SHALL accept the following CLI arguments:
- `--agent <name>` or `-a <name>`: Use a predefined agent preset
- `--target <path>` or `-t <path>`: Use a custom target directory
- `--dry-run`: Preview changes without executing
- `--yes`: Skip all confirmation prompts
- `--help` or `-h`: Show usage information

#### Scenario: --agent selects preset
- **WHEN** user passes `--agent opencode`
- **THEN** the target directory SHALL resolve to `.opencode/skills`

#### Scenario: --target uses custom path
- **WHEN** user passes `--target .custom/path`
- **THEN** the script SHALL use `.custom/path` as the target

#### Scenario: --agent and --target are mutually exclusive
- **WHEN** user passes both `--agent opencode` and `--target .custom/path`
- **THEN** the script SHALL exit with an error message

#### Scenario: --dry-run preview
- **WHEN** user passes `--dry-run`
- **THEN** the script SHALL display what would happen without creating any symlinks

#### Scenario: --help shows usage
- **WHEN** user passes `--help`
- **THEN** the script SHALL print usage information and exit

### Requirement: Agent preset configuration
The script SHALL define an extensible agent preset data structure.

#### Scenario: OpenCode preset exists
- **WHEN** script starts with `--agent opencode`
- **THEN** it SHALL use label `OpenCode`, dir `.opencode/skills`, strategy `flatten`

#### Scenario: Extensible structure
- **WHEN** a new agent needs to be added
- **THEN** adding an entry to the AGENTS object SHALL be sufficient without modifying the core logic

### Requirement: Fixed skill list
The script SHALL define a global `SKILLS` constant listing only the skills to be linked.

#### Scenario: SKILLS constant defines which skills to link
- **WHEN** script starts
- **THEN** it SHALL only link skills listed in the `SKILLS` constant
- **THEN** it SHALL NOT scan or link skills not in the list

#### Scenario: SKILLS entry format
- **WHEN** a skill is defined in `SKILLS`
- **THEN** each entry SHALL contain `category` and `name` fields mapping to `skills/<category>/<name>/`

#### Scenario: Skill not found in source
- **WHEN** a skill listed in `SKILLS` does not exist in `skills/<category>/<name>/`
- **THEN** the script SHALL display an error and skip that skill

### Requirement: Flatten path mapping
The script SHALL map `skills/<category>/<name>` to `<target>/<name>`.

#### Scenario: Path flattening
- **WHEN** linking `skills/agent/skill-create` to target `.opencode/skills`
- **THEN** the symlink SHALL be created at `.opencode/skills/skill-create`

### Requirement: Conflict detection and user confirmation
When the target path already exists, the script SHALL detect the conflict and prompt the user.

#### Scenario: Conflict detected
- **WHEN** target `skill-create` already exists in the target directory
- **THEN** the script SHALL display a warning message
- **THEN** the script SHALL prompt the user for confirmation before overwriting

#### Scenario: User confirms overwrite
- **WHEN** user types `y` at the conflict prompt
- **THEN** the script SHALL remove the existing target and create a new symlink

#### Scenario: User declines overwrite
- **WHEN** user types `n` at the conflict prompt
- **THEN** the script SHALL skip this skill and continue

#### Scenario: --yes skips prompts
- **WHEN** `--yes` flag is set
- **THEN** the script SHALL automatically overwrite all conflicts without prompting

### Requirement: Visual output with picocolors
The script SHALL use picocolors for colored terminal output.

#### Scenario: Status markers
- **WHEN** a symlink is created
- **THEN** the script SHALL show a green checkmark and the source→target path
- **WHEN** a conflict is overwritten
- **THEN** the script SHALL show a yellow warning
- **WHEN** an error occurs
- **THEN** the script SHALL show a red cross

#### Scenario: Summary table
- **WHEN** linking completes
- **THEN** the script SHALL display a summary table showing success count, overwrite count, and failure count

### Requirement: Postinstall auto-execution
The script SHALL be automatically invoked after `npm install` via the `postinstall` hook.

#### Scenario: postinstall triggers link-skills
- **WHEN** user runs `npm install`
- **THEN** the `postinstall` script SHALL execute `node scripts/link-skills.mjs --agent opencode --yes`

#### Scenario: postinstall uses --yes
- **WHEN** postinstall runs the script
- **THEN** it SHALL pass `--yes` to skip interactive prompts
