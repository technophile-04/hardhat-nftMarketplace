import { moveBlocks } from '../utils/moveBlock';

const NO_OF_BLOCKS = 2;
const SLEEP_AMOUNT = 1000;

async function mine() {
    await moveBlocks(NO_OF_BLOCKS, SLEEP_AMOUNT);
}

mine()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
