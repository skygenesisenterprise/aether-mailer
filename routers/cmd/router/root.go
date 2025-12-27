package router

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile string
	host    string
	port    int
	verbose bool
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "router",
	Short: "Aether Mailer Router",
	Long: `Aether Mailer Router is an infrastructure-level router and control plane
for the Aether Mailer ecosystem. It handles request routing, load balancing,
service discovery, and security at the infrastructure level.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Aether Mailer Router - Infrastructure-level routing and control plane")
		fmt.Println("Use 'router start' to start the router or 'router --help' for available commands")
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.router.yaml)")
	rootCmd.PersistentFlags().StringVar(&host, "host", "0.0.0.0", "host to bind to")
	rootCmd.PersistentFlags().IntVar(&port, "port", 80, "port to bind to")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")

	// Bind flags to viper
	viper.BindPFlag("host", rootCmd.PersistentFlags().Lookup("host"))
	viper.BindPFlag("port", rootCmd.PersistentFlags().Lookup("port"))
	viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))

	// Add subcommands
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(stopCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(healthCmd)
	rootCmd.AddCommand(versionCmd)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".router" (without extension).
		viper.AddConfigPath(home)
		viper.AddConfigPath(".")
		viper.AddConfigPath("/etc/router")
		viper.SetConfigType("yaml")
		viper.SetConfigName("router")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		if verbose {
			fmt.Println("Using config file:", viper.ConfigFileUsed())
		}
	}
}
