options(repos=c(CRAN="https://cran.r-project.org"))
stopifnot(requireNamespace("rwasm",quietly=TRUE))
dir.create("build/binaries",recursive=TRUE,showWarnings=FALSE)
dir.create("build/sources",recursive=TRUE,showWarnings=FALSE)
# Exact source versions; never silently switch versions or engine ABI.
versions <- c(quadprog="1.5-8", mnormt="2.1.1", pbivnorm="0.6.0",
              numDeriv="2016.8-1.1", jsonlite="2.0.0", lavaan="0.6-20")
for(p in names(versions)){
  archive <- paste0(p,"_",versions[[p]],".tar.gz")
  dest <- file.path("build/sources",archive)
  urls <- c(paste0("https://cran.r-project.org/src/contrib/",archive),
            paste0("https://cran.r-project.org/src/contrib/Archive/",p,"/",archive))
  downloaded <- FALSE
  for(url in urls){
    ok <- tryCatch({
      download.file(url,dest,mode="wb",method="libcurl")
      length(untar(dest,list=TRUE))>0
    },error=function(e){message(conditionMessage(e));FALSE})
    if(ok){downloaded<-TRUE;break}
  }
  if(!downloaded)stop("소스 다운로드 실패: ",p)
  untar(dest,exdir="build/sources")
  ref <- paste0("local::",normalizePath(file.path("build/sources",p)))
  rwasm::build(ref,out_dir="build/binaries",dependencies=FALSE,compress=TRUE)
}
