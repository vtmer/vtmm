.PHONY: make_ext

name=vtmm
extension_src_path=src
chrome=`ls /usr/bin | grep 'chrom' | head -1`

make_ext:
	if [ -a ${name}.pem ]; \
	then \
		${chrome} --pack-extension=${extension_src_path} --pack-extension-key=${name}.pem; \
	else \
		${chrome} --pack-extension=${extension_src_path}; \
		mv -f ${extension_src_path}.pem ${name}.pem; \
	fi;
	mv -f ${extension_src_path}.crx ${name}.crx
