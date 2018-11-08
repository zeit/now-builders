package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		// Args should have the program name on `0`
		// and the file name on `1`
		fmt.Println("Wrong number of args; Usage is:\n  ./get-exported-function-name file_name.go")
		os.Exit(1)
	}
	fileName := os.Args[1]
	fset := token.NewFileSet()

	parsed, err := parser.ParseFile(fset, fileName, nil, parser.ParseComments)
	if err != nil {
		fmt.Printf("Could not parse Go file \"%s\"\n", fileName)
		os.Exit(1)
	}

	output := make([]string, 0)
	for _, decl := range parsed.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok {
			// this declaraction is not a function
			// so we're not interested
			continue
		}
		if fn.Name.IsExported() == true {
			// we found a exported function
			// we save it to the outpout array!
			output = append(output, fn.Name.Name)
		}
	}
	fmt.Println(strings.Join(output, ","))
	os.Exit(0)
}
