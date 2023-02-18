//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [18321827228819101621298013131065785268641968288301166603039363337455384517151,
             4206167035397213031892827764568824857610258283581851924476970803818645408874],
            [15419442249788096095779576639788841608626769604015292350180516255061451539952,
             777969028842713322680235158005129546976125343996519034125748809783261050064]
        );
        vk.IC = new Pairing.G1Point[](22);
        
        vk.IC[0] = Pairing.G1Point( 
            13541717500856024457832883499727149298927872073855140646746130345680292190066,
            16419875784136259132397720091890193503937141450034723219230755077214844789425
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            3752331737519129951663322292354405588086052692037441711629790863245952376816,
            7410567159676740615856836352588439449524255702960375253844482706808715931655
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            4959746151537467904606204209453441105872096997381093122282860315537311856782,
            3464874273947304203597915377782268633159713263943234125545744493311289446379
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            11918658178799963429286190427276062414387592770975219917754528255968982553117,
            18863159819576025009272426614097576100595835152275634630113510469949642597156
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            12080017977335241609935185446038353216843980055973749184690152298649094271928,
            12118818506686111235734387144452531915060636928608288800309025570361484027705
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            10102213445983470836980664515204650624354438418840618706840939195307591060230,
            5484779421364345318416658522015637792647317411248198103469068807269059267100
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            9763865250394933636437184994581862632198947773782514540798843690218530416904,
            15872399129415722579191530472335941324283122184382540794361394015126523112103
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            17994389866446299051540359213251516691575550856974893460567928678590988076205,
            3690993847597205972001554593009840185892536390418622344997387798271740455635
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            1514749532164539828711113211013262882315064549879783847431579944017854184510,
            20526927679666612407717936286228214237728412628818975947512539870164110719120
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            15014516812605025096058590526767990114406762745582130788257529322377763126041,
            19176310382039256905535560410824891239729592126606296493300750682627205068110
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            18526311327283273568903924381019544478782070770890522668889080024328280419198,
            13785214974078832916951078844118174984545953571576748873108758932677398724733
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            7438130629754250663867511302854696730076659831094119452132475791068820434857,
            5434978930738074639816673978168303827928105769766371044946335016536308011478
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            521403615012278029271655741592473139985482171022002625906648790354620875981,
            3116683848632779152289472729487357792751009663246481511116135298970360523542
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            13152436013103215834503458119571706028694372510702882725990687273730723438483,
            19461945222562230301114616906596639533332395260596325923782717371274900535897
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            3962742207405883910801311526116539394827130528582185077945927718238721260941,
            7870164129123610200920064014770823027006895523112369535230779480659048631483
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            1809281155945818970163947188283112004346275687602552866508315970694460013280,
            21624220170474209977243623949646577255680583794486830729608615274519636706998
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            8312602549602742674535581346219949417719805348950112028464425562612741747409,
            8754745386484111385296010253665298324007185380377780848615736490985745443339
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            2105554605167504418865073737028753134135369623789492830778875416007043042976,
            5254190214110152563701807169809119482795296745318815856310528807180293758741
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            12835322928886177581657895356368176339008527248985190757355728116492591222197,
            8778570747204772784941286666648163850131249324600106353915768167356560905644
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            7396070230494712718712252913347891738823169483297936313318939433100914087686,
            17890305678327491141068958007284406330402475874043080952568722872517967744823
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            9992184566302911384497048272954545876818726224732119470651345109626032335109,
            14535859380903241383335552516130454133166491050808832908552188131092359848725
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            3001402446121154180312411437240159738736162890747572539340081629329786110432,
            11960463806261238715333091199698471226420021117298790508402172282923434911872
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[21] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
