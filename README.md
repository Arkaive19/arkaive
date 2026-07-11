# Arkaive

A simple command-line tool for organizing, sorting, and tagging files using SQLite.

## Overview

Managing large collections of images and files with traditional folders can quickly become difficult. The same file often belongs in multiple categories, leading to duplicate copies or complicated folder structures.

**Arkaive** solves this by using a fast, SQLite-backed tag system instead of relying solely on folders. Organize your files with as many tags as you need and find them instantly without creating duplicates.

## Features

- 🏷️ Organize files with flexible tags
- ⚡ Fast SQLite-powered storage and search
- 📁 Keep files organized without duplicate copies
- 🖥️ Lightweight command-line interface
- 🔧 Simple and extensible architecture
- ⚡ fuzzy search for stored structures, and easy structure

## Why Arkaive?

Instead of forcing every file into a single folder hierarchy, Arkaive lets you organize files with tags. A single file can belong to multiple categories without creating duplicate copies, making it much easier to manage growing collections of images, documents, and other data.

## Built for Hack Club Stardance

Arkaive was built as part of **Hack Club Stardance**, where the goal was to create and ship a real project from start to finish. The project was an opportunity to learn more about building CLI applications, working with SQLite, and publishing packages to npm.

## AI Usage

To be transparent, AI was used only as a development aid for:

- Looking up SQLite queries and syntax
- Debugging issues during development
- Troubleshooting problems while publishing the package to npm

The application's design, implementation, features, and overall architecture were created by me.

## Roadmap

The long-term goal is to evolve Arkaive into a cross-platform desktop application with an intuitive interface while preserving the speed and flexibility of the CLI.

Future plans include:

- Graphical desktop application
- File previews
- Faster search and filtering
- Import/export functionality
- Plugin support

Contributions, feature requests, and suggestions are always welcome!

## Usage

  most of it is self explanatory, but for further clarification;
  
 ```bash
arkaive untag /path/to/file
arkaive remove /path/to/file
arkaive search tag:tagname
arkaive search path:pathlocation
arkaive search header:content AND header:content
arkaive search header:content OR header:content
arkaive search header:content NOT header:content

```

## Installation

Install the CLI globally with npm:

```bash
npm install -g arkaive
```

## Getting Started

Launch Arkaive:

```bash
arkaive
```

To see all available commands:

```bash
arkaive --help
```
