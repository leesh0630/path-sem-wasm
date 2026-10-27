# PATH SEM 2.4 — 닷홈 동봉 패키지 빌드 준비본

## 먼저 알아둘 점
이 ZIP에는 완성된 Wasm 바이너리가 없습니다. HTML만 바꿔서는 기존 오류가 해결되지 않습니다.
GitHub Actions에서 실제로 빌드하고 브라우저 검사까지 통과해야 `lavaan_dothome_ready` 산출물이 만들어집니다.
이 대화 환경에는 R/Docker가 없어 이 빌드 및 실제 분석은 실행하지 못했습니다.

## 수정 내용
- HTML은 첨부된 PATH SEM 2.2를 바탕으로 작성했습니다.
- ./wasm/manifest.json이 있으면 같은 서버의 패키지를 우선 설치합니다.
- manifest의 webR 버전, R 주·부 버전, 각 파일 SHA-256, 압축 경로, DESCRIPTION을 검사합니다.
- 동봉 모드에서는 외부 PACKAGES 목록 확인을 생략합니다.
- manifest가 404인 경우에만 기존 외부 저장소로 진행합니다. 다른 HTTP/JSON 오류는 숨기지 않습니다.
- 연결 완료 전에 quadprog::solve.QP 실제 계산 및 lavaan CFA 수렴을 검사합니다.
- 잠재변인 텍스트 입력, 지표 다중 선택, 300명 예제 등 기존 분석 UI는 유지했습니다.
- webR 엔진 자체는 여전히 외부 CDN에서 내려받습니다. 완전 오프라인 구성은 아닙니다.

## GitHub에서 한 번 빌드하기
1. GitHub에 로그인해 본인 계정에 새 저장소를 만듭니다. 예: path-sem-wasm.
   공개 저장소로 만들면 시작하기 쉽습니다. 데이터/비밀번호/토큰은 올리지 마세요.
2. ZIP을 PC에서 풉니다. 저장소 루트에 `index.html` 및 `scripts` 폴더 전체를 업로드합니다.
   ZIP 파일 자체만 업로드하면 실행되지 않습니다.
3. `.github/workflows/build.yml`도 같은 경로로 올립니다.
   숨김 폴더라 업로드가 어렵다면 GitHub의 Add file → Create new file에서
   파일명을 `.github/workflows/build.yml`로 쓰고, ZIP 속 build.yml 내용을 복사해 저장합니다.
4. Actions 탭 → Build and test SEM Wasm bundle → Run workflow를 누릅니다.
   main/master에 push할 때도 자동 시작됩니다.
5. 성공하면 실행 결과 하단 Artifacts의 `lavaan_dothome_ready`를 다운로드합니다.
   이 산출물은 소스 빌드, 바이너리 검사, 실제 Chromium에서 quadprog 계산·CFA·300명 예제 SEM 검사가
   모두 통과한 경우에만 생성되도록 구성했습니다. 아직 이 작성 환경에서 통과를 확인한 것은 아닙니다.
6. 실패하면 실행 상세의 빨간 단계 로그를 보내주세요.
   `build_and_browser_diagnostics` 산출물이 있으면 함께 보내주세요.
   컨테이너 태그, 네트워크, CRAN 소스, 빌드 도구 변화 등에 따라 실패할 수 있습니다.

## 닷홈 업로드 (성공한 산출물만)
기존 index.html을 먼저 백업하세요.
산출물 ZIP을 풀면 나오는 아래 두 항목을 닷홈 /lavaan/ 폴더에 업로드합니다.
```
lavaan/
  index.html
  wasm/
    manifest.json
    quadprog_1.5-8.tgz
    mnormt_2.1.1.tgz
    pbivnorm_0.6.0.tgz
    numDeriv_2016.8-1.1.tgz
    jsonlite_2.0.0.tgz
    lavaan_0.6-20.tgz
```
바이너리 파일은 FTP 바이너리/자동 모드로 업로드합니다. 확장자나 파일명을 바꾸지 마세요.
.tgz 내부를 직접 풀 필요도 없습니다.
package_sources 폴더에는 원본 소스와 라이선스가 포함됩니다. 배포 시 함께 보존하세요.
앱 실행에는 index.html과 wasm 폴더가 필수입니다.
CRAN에서 받은 .tar.gz를 위 .tgz 대신 넣으면 안 됩니다.
MASS는 고정 webR의 기본 권장 패키지로 제공되는 것을 전제로 합니다. 없다면 초기화가 명시적으로 실패합니다.

사이트: https://hsychild0000.dothome.co.kr/lavaan/index.html
강력 새로고침(Ctrl+Shift+R) 후 00 로그에서 다음을 확인하세요.
- 동봉 패키지 로드 완료 · 외부 저장소 목록 조회 생략
- quadprog 실제 최적화 계산 통과
- 연결 완료 · lavaan 로드 및 측정모형 시작 점검 완료
그 뒤 SEM 예제 불러오기 → 원자료 기본분석 실행을 확인합니다.
CI의 localhost 검사 통과만으로 닷홈의 업로드/호스팅까지 검증되지는 않습니다.

## 고정 빌드
- 도구체인 컨테이너: ghcr.io/r-wasm/webr:0.5.4
- 런타임: https://webr.r-wasm.org/v0.5.4/
- R 바이너리 호환 검사: R 4.5 및 emscripten
- quadprog 소스: https://cran.r-project.org/src/contrib/quadprog_1.5-8.tar.gz
- 현재 CRAN 경로가 실패하면 해당 버전 CRAN Archive 경로를 시도합니다.
- 패키지는 고정 버전 소스로 빌드하며 버전을 몰래 바꾸지 않습니다.
- 컨테이너 태그는 이름으로 고정했으며 이미지 digest까지 고정한 재현 빌드는 아닙니다.

## 검증 범위
이 작성 환경에서 확인:
- 앱 JavaScript 문법 검사 통과
- 로더 모의 검사 10개 통과 (404, 버전 불일치, 누락, 해시, 경로 등)
- Python 포장 스크립트 문법 검사 통과
- YAML 파싱 통과
미확인:
- 실제 Docker/Wasm 빌드
- 실제 브라우저 webR, quadprog, lavaan 실행
- 닷홈에서의 종단간 실행
위 검증을 혼동하지 마세요.

## 공식 참고 자료
https://docs.r-wasm.org/webr/v0.5.4/building.html
https://r-wasm.github.io/rwasm/reference/build.html
https://raw.githubusercontent.com/r-wasm/webr/v0.5.4/Dockerfile
