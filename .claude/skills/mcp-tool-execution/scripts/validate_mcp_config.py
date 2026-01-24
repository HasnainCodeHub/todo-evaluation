#!/usr/bin/env python3
"""
MCP Configuration Validator

This script validates MCP server configurations, tool schemas,
and ensures compliance with MCP specifications.
"""

import json
import sys
from typing import Dict, List, Any, Optional
from pathlib import Path
import jsonschema
from urllib.parse import urlparse


class MCPConfigValidator:
    """Validator for MCP server configurations."""

    def __init__(self):
        self.errors = []
        self.warnings = []

    def validate_server_config(self, config_path: str) -> bool:
        """Validate an MCP server configuration file."""
        self.errors = []
        self.warnings = []

        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON in config file: {e}")
            return False
        except FileNotFoundError:
            self.errors.append(f"Config file not found: {config_path}")
            return False

        # Validate basic structure
        if not self._validate_basic_structure(config):
            return False

        # Validate tools
        if 'tools' in config:
            self._validate_tools(config['tools'])

        # Validate resources
        if 'resources' in config:
            self._validate_resources(config['resources'])

        # Validate prompts
        if 'prompts' in config:
            self._validate_prompts(config['prompts'])

        return len(self.errors) == 0

    def _validate_basic_structure(self, config: Dict[str, Any]) -> bool:
        """Validate the basic structure of the config."""
        required_fields = ['name', 'version']
        for field in required_fields:
            if field not in config:
                self.errors.append(f"Missing required field: {field}")

        if 'name' in config and not isinstance(config['name'], str):
            self.errors.append("name must be a string")

        if 'version' in config and not isinstance(config['version'], str):
            self.errors.append("version must be a string")

        return len(self.errors) == 0

    def _validate_tools(self, tools: List[Dict[str, Any]]) -> None:
        """Validate tool configurations."""
        if not isinstance(tools, list):
            self.errors.append("tools must be a list")
            return

        for i, tool in enumerate(tools):
            if not isinstance(tool, dict):
                self.errors.append(f"Tool at index {i} must be an object")
                continue

            # Validate required fields
            required_fields = ['name', 'description']
            for field in required_fields:
                if field not in tool:
                    self.errors.append(f"Tool at index {i} missing required field: {field}")

            # Validate name format
            if 'name' in tool:
                if not isinstance(tool['name'], str) or not tool['name'].strip():
                    self.errors.append(f"Tool at index {i} name must be a non-empty string")

                # Check for valid naming convention
                if not self._is_valid_name(tool['name']):
                    self.warnings.append(f"Tool at index {i} name '{tool['name']}' may not follow naming conventions")

            # Validate description
            if 'description' in tool:
                if not isinstance(tool['description'], str) or not tool['description'].strip():
                    self.errors.append(f"Tool at index {i} description must be a non-empty string")

            # Validate input schema if present
            if 'inputSchema' in tool:
                self._validate_input_schema(tool['inputSchema'], f"tool[{i}]")

    def _validate_resources(self, resources: List[Dict[str, Any]]) -> None:
        """Validate resource configurations."""
        if not isinstance(resources, list):
            self.errors.append("resources must be a list")
            return

        for i, resource in enumerate(resources):
            if not isinstance(resource, dict):
                self.errors.append(f"Resource at index {i} must be an object")
                continue

            # Validate required fields
            required_fields = ['name', 'description', 'uri']
            for field in required_fields:
                if field not in resource:
                    self.errors.append(f"Resource at index {i} missing required field: {field}")

            # Validate URI format
            if 'uri' in resource:
                if not self._is_valid_uri(resource['uri']):
                    self.errors.append(f"Resource at index {i} has invalid URI: {resource['uri']}")

    def _validate_prompts(self, prompts: List[Dict[str, Any]]) -> None:
        """Validate prompt configurations."""
        if not isinstance(prompts, list):
            self.errors.append("prompts must be a list")
            return

        for i, prompt in enumerate(prompts):
            if not isinstance(prompt, dict):
                self.errors.append(f"Prompt at index {i} must be an object")
                continue

            # Validate required fields
            required_fields = ['name', 'description', 'template']
            for field in required_fields:
                if field not in prompt:
                    self.errors.append(f"Prompt at index {i} missing required field: {field}")

            # Validate template
            if 'template' in prompt:
                if not isinstance(prompt['template'], str) or not prompt['template'].strip():
                    self.errors.append(f"Prompt at index {i} template must be a non-empty string")

    def _validate_input_schema(self, schema: Dict[str, Any], context: str) -> None:
        """Validate JSON Schema for input validation."""
        try:
            # This will raise an exception if the schema is invalid
            jsonschema.validators.validator_for(schema).check_schema(schema)
        except jsonschema.SchemaError as e:
            self.errors.append(f"{context} has invalid JSON Schema: {e}")

    def _is_valid_name(self, name: str) -> bool:
        """Check if name follows recommended naming conventions."""
        import re
        # Allow alphanumeric, hyphens, underscores, dots
        pattern = r'^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$'
        return bool(re.match(pattern, name))

    def _is_valid_uri(self, uri: str) -> bool:
        """Check if URI is valid."""
        try:
            result = urlparse(uri)
            return all([result.scheme, result.netloc])
        except Exception:
            return False

    def validate_tool_parameters(self, params: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate parameters against a schema."""
        self.errors = []
        self.warnings = []

        try:
            jsonschema.validate(params, schema)
            return True
        except jsonschema.ValidationError as e:
            self.errors.append(f"Parameter validation failed: {e.message}")
            return False

    def get_report(self) -> Dict[str, List[str]]:
        """Get validation report."""
        return {
            "errors": self.errors,
            "warnings": self.warnings
        }

    def print_report(self) -> None:
        """Print validation report to console."""
        if self.errors:
            print("❌ Validation Errors:")
            for error in self.errors:
                print(f"  - {error}")

        if self.warnings:
            print("\\n⚠️  Validation Warnings:")
            for warning in self.warnings:
                print(f"  - {warning}")

        if not self.errors and not self.warnings:
            print("✅ Configuration is valid!")


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_mcp_config.py <config_file.json>")
        sys.exit(1)

    config_path = sys.argv[1]

    validator = MCPConfigValidator()
    is_valid = validator.validate_server_config(config_path)

    validator.print_report()

    if not is_valid:
        sys.exit(1)


if __name__ == "__main__":
    main()