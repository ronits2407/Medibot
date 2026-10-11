all: main.pdf

main.pdf: main.tex references.bib
	pdflatex -interaction=nonstopmode -halt-on-error main.tex
	bibtex main
	pdflatex -interaction=nonstopmode -halt-on-error main.tex
	pdflatex -interaction=nonstopmode -halt-on-error main.tex

clean:
	rm -f *.aux *.log *.out *.bbl *.blg *.toc *.lot *.lof *.synctex.gz

distclean: clean
	rm -f main.pdf

.PHONY: all clean distclean
