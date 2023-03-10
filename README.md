# Notice
This repository is no longer actively maintained and has been archived. A successor repository is available at [shelvenzhou/phat-lego-oracle](https://github.com/shelvenzhou/phat-lego-oracle), which contains the latest updates and improvements.

# Simple LEGO
This is a demo phat contract that shows how to implement a LEGO-like app in JavaScript.

The main logic is in the file [contracts/lego/js/src/index.ts](contracts/lego/js/src/index.ts)

See [here](tests/legoActions.test.ts#L129) for usage examples.

## How to play

```bash
git clone https://github.com/kvinwang/phat-simple-lego.git --recursive
cd phat-simple-lego
yarn
yarn devphase compile --release # optional
yarn devphase test
```

## Development

If you modified the `contracts/lego/js/src/index.ts`, you need to run the following commands to make it work:

```bash
cd contracts/lego/js/
yarn && yarn build
cd -
yarn devphase compile --release
```

Tell me if you get into any trouble.
