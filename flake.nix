{
  description = "ProductCompare backend development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
        postgres = if pkgs ? postgresql_18 then pkgs.postgresql_18 else pkgs.postgresql;
        beamPackages = if pkgs.beam.packages ? erlang_28 then pkgs.beam.packages.erlang_28 else pkgs.beam.packages.erlang;
        erlangPkg = if pkgs ? erlang_28 then pkgs.erlang_28 else beamPackages.erlang;
        elixirPkg = if beamPackages ? elixir_1_19 then beamPackages.elixir_1_19 else beamPackages.elixir;
      in {
        devShells.default = pkgs.mkShell {
          packages =
            with pkgs;
              [
                elixirPkg
                erlangPkg
                git
                postgres
              ] ++ lib.optionals stdenv.isLinux [inotify-tools];

          shellHook = ''
            export MIX_ENV=''${MIX_ENV:-dev}
            export MIX_HOME=$PWD/.mix
            export HEX_HOME=$PWD/.hex
            export PGHOST=''${PGHOST:-127.0.0.1}
            export PGPORT=''${PGPORT:-5433}
            export PGUSER=''${PGUSER:-postgres}
            export PGPASSWORD=''${PGPASSWORD:-postgres}
          '';
        };
      });
}
